import Badge from '@/components/ui/Badge'
import { AnimalStatus } from '@/types'

const variantMap: Record<AnimalStatus, 'green' | 'gray' | 'red'> = {
  active: 'green',
  sold: 'gray',
  deceased: 'red',
  butchered: 'gray',
  culled: 'red',
}

export default function AnimalStatusBadge({ status }: { status: AnimalStatus }) {
  return <Badge variant={variantMap[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
}
