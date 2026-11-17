'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ModuleName } from '@/lib/permissions/permissions'

export function usePermissions() {
  const [permissions, setPermissions] = useState<Record<ModuleName, { can_read: boolean; can_write: boolean }>>({
    users: { can_read: false, can_write: false },
    orders: { can_read: false, can_write: false },
    employees: { can_read: false, can_write: false },
    inventory: { can_read: false, can_write: false },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPermissions() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // @ts-ignore - Database types not generated yet
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          roles (
            role_permissions (
              module,
              can_read,
              can_write
            )
          )
        `)
        .eq('id', user.id)
        .single()

      if (profile && profile.roles) {
        const perms: Record<ModuleName, { can_read: boolean; can_write: boolean }> = {
          users: { can_read: false, can_write: false },
          orders: { can_read: false, can_write: false },
          employees: { can_read: false, can_write: false },
          inventory: { can_read: false, can_write: false },
        }

        profile.roles.role_permissions.forEach((p: { module: ModuleName; can_read: boolean; can_write: boolean }) => {
          if (p.module in perms) {
            perms[p.module as ModuleName] = {
              can_read: p.can_read,
              can_write: p.can_write,
            }
          }
        })

        setPermissions(perms)
      }

      setLoading(false)
    }

    fetchPermissions()
  }, [])

  const hasPermission = (module: ModuleName, type: 'read' | 'write' = 'read') => {
    return permissions[module][`can_${type}`]
  }

  return { permissions, hasPermission, loading }
}
