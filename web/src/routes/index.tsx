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
import { createFileRoute, redirect } from '@tanstack/react-router'

import { saveAffiliateCode } from '@/features/auth/lib/storage'
import { Home } from '@/features/home'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/')({
  // START custom authenticated-root change: send signed-in root visits to the console.
  beforeLoad: ({ location }) => {
    const { auth } = useAuthStore.getState()
    if (!auth.user || !auth.accessToken) return

    // RootComponent normally persists affiliate codes after rendering. Because
    // authenticated visitors redirect before Home renders, preserve it here.
    const aff = new URL(location.href, window.location.origin).searchParams
      .get('aff')
      ?.trim()
    if (aff) {
      saveAffiliateCode(aff)
    }

    throw redirect({ to: '/dashboard', replace: true })
  },
  // END custom authenticated-root change: anonymous home-page behavior remains unchanged.
  component: Home,
})
