package model

import (
	"fmt"
	"os"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func TestUserCheckinQuotaCeilingExemptsAdminAndRoot(t *testing.T) {
	for _, dialect := range []string{"sqlite", "mysql", "postgres"} {
		t.Run(dialect, func(t *testing.T) {
			var driver gorm.Dialector
			switch dialect {
			case "sqlite":
				driver = sqlite.Open(":memory:")
			case "mysql":
				dsn := os.Getenv("TEST_MYSQL_DSN")
				if dsn == "" {
					t.Skip("TEST_MYSQL_DSN not configured")
				}
				driver = mysql.Open(dsn)
			case "postgres":
				dsn := os.Getenv("TEST_POSTGRES_DSN")
				if dsn == "" {
					t.Skip("TEST_POSTGRES_DSN not configured")
				}
				driver = postgres.Open(dsn)
			}
			db, err := gorm.Open(driver, &gorm.Config{NamingStrategy: schema.NamingStrategy{TablePrefix: "checkin_test_"}})
			require.NoError(t, err)
			sqlDB, err := db.DB()
			require.NoError(t, err)
			sqlDB.SetMaxOpenConns(1)
			previousDB, previousType := DB, common.MainDatabaseType()
			DB = db
			common.SetMainDatabaseType(common.DatabaseType(dialect))
			initCol()
			t.Cleanup(func() {
				require.NoError(t, db.Migrator().DropTable(&Checkin{}, &User{}))
				DB = previousDB
				common.SetMainDatabaseType(previousType)
				initCol()
				require.NoError(t, sqlDB.Close())
			})
			require.NoError(t, db.AutoMigrate(&User{}, &Checkin{}))

			checkinSetting := operation_setting.GetCheckinSetting()
			previousSetting := *checkinSetting
			*checkinSetting = operation_setting.CheckinSetting{Enabled: true, MinQuota: 1000, MaxQuota: 1000}
			t.Cleanup(func() { *checkinSetting = previousSetting })

			for i, tc := range []struct {
				name   string
				role   int
				capped bool
			}{
				{name: "common_user_is_capped", role: common.RoleCommonUser, capped: true},
				{name: "admin_is_exempt", role: common.RoleAdminUser},
				{name: "root_is_exempt", role: common.RoleRootUser},
			} {
				t.Run(tc.name, func(t *testing.T) {
					user := User{
						Username: fmt.Sprintf("checkin-%d", i),
						AffCode:  fmt.Sprintf("ci%d", i),
						Role:     tc.role,
						Quota:    MaxUserRemainQuota,
					}
					require.NoError(t, db.Create(&user).Error)

					checkin, err := UserCheckin(user.Id)
					reloaded := User{}
					require.NoError(t, db.First(&reloaded, user.Id).Error)
					if tc.capped {
						assert.ErrorContains(t, err, "当前余额已达上限")
						assert.Nil(t, checkin)
						assert.Equal(t, MaxUserRemainQuota, reloaded.Quota)
						return
					}
					require.NoError(t, err)
					assert.Equal(t, 1000, checkin.QuotaAwarded)
					assert.Equal(t, MaxUserRemainQuota+1000, reloaded.Quota)
				})
			}
		})
	}
}
