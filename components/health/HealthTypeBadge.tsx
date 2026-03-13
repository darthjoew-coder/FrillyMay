import Badge from '@/components/ui/Badge'
import { HealthType } from '@/types'

const variantMap: Record<HealthType, 'blue' | 'purple' | 'orange' | 'red' | 'yellow' | 'green' | 'gray' | 'brown'> = {
  vaccination: 'blue',
  medication: 'purple',
  vet_visit: 'orange',
  injury: 'red',
  illness: 'yellow',
  deworming: 'green',
  weight_check: 'gray',
  hoof_care: 'brown',
  other: 'gray',
}

export default function HealthTypeBadge({ type }: { type: HealthType }) {
  return <Badge variant={variantMap[type]}>{type.replace(/_/g, ' ')}</Badge>
}
