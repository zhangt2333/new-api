/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useStatus } from '@/hooks/use-status'
import { getSelf } from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

import { performCheckin } from '../api'

// START custom automatic check-in change: run one best-effort daily check-in per authenticated user.
export function useAutoCheckin(): {
  awardedQuota: number | null
  dismissAward: () => void
} {
  const queryClient = useQueryClient()
  const { status, loading } = useStatus()
  const userId = useAuthStore((state) => state.auth.user?.id)
  const attemptedUserIdRef = useRef<number | null>(null)
  const [awardedQuota, setAwardedQuota] = useState<number | null>(null)

  const dismissAward = useCallback(() => setAwardedQuota(null), [])

  useEffect(() => {
    if (loading || status?.checkin_enabled !== true || !userId) return
    if (attemptedUserIdRef.current === userId) return

    attemptedUserIdRef.current = userId

    const checkin = async () => {
      try {
        const response = await performCheckin(undefined, {
          skipBusinessError: true,
          skipErrorHandler: true,
        })
        if (!response.success || !response.data) return

        if (useAuthStore.getState().auth.user?.id !== userId) return

        setAwardedQuota(response.data.quota_awarded)

        await queryClient.invalidateQueries({ queryKey: ['checkin-status'] })

        const selfResponse = await getSelf()
        if (!selfResponse.success || !selfResponse.data) return

        const auth = useAuthStore.getState().auth
        if (auth.user?.id === userId) {
          auth.setUser(selfResponse.data as AuthUser)
        }
      } catch {
        // Automatic check-in is best-effort and must not interrupt console use.
      }
    }

    void checkin()
  }, [loading, queryClient, status?.checkin_enabled, userId])

  return { awardedQuota, dismissAward }
}
// END custom automatic check-in change: console-entry hook complete.
