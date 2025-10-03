import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'

export default function AddNewWineButton() {
  const navigate = useNavigate()
  return (
    <Button aria-label="Add new wine" onClick={() => navigate('/add-wine')}>
      Add New Wine
    </Button>
  )
}
