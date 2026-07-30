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
// START custom automatic check-in change: prominently show the daily check-in reward on console entry.
import { Gift } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatQuotaWithCurrency } from '@/lib/currency'

interface AutoCheckinRewardDialogProps {
  awardedQuota: number | null
  onClose: () => void
}

export function AutoCheckinRewardDialog({
  awardedQuota,
  onClose,
}: AutoCheckinRewardDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog
      open={awardedQuota !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className='sm:max-w-md' showCloseButton={false}>
        <DialogHeader className='items-center gap-4 text-center'>
          <div className='bg-primary/10 flex size-16 items-center justify-center rounded-full'>
            <Gift className='text-primary size-8' />
          </div>
          <DialogTitle className='text-xl'>
            {t('Check-in successful! Received')}
          </DialogTitle>
        </DialogHeader>
        <div className='text-primary py-2 text-center text-5xl font-bold tracking-tight'>
          +{formatQuotaWithCurrency(awardedQuota ?? 0)}
        </div>
        <Button size='lg' className='w-full' onClick={onClose}>
          {t('Confirm')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
// END custom automatic check-in change: reward dialog component complete.
