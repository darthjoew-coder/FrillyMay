import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import ExpenseForm from '@/components/accounting/ExpenseForm'

export default function NewExpensePage() {
  return (
    <>
      <TopBar title="Log Expense" subtitle="Record a new farm expense" />
      <PageWrapper><ExpenseForm /></PageWrapper>
    </>
  )
}
