interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

import React from 'react'
import HealthAlerts from './HealthAlerts'

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <div className="flex items-center justify-between pl-14 pr-6 md:px-6 py-4 bg-white border-b border-gray-200">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4 min-w-0 flex-1 justify-center px-4">
        <HealthAlerts />
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  )
}
