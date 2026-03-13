'use client'
import { useState, useEffect, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import PageWrapper from '@/components/layout/PageWrapper'
import CategoryForm from '@/components/accounting/CategoryForm'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { IExpenseCategory } from '@/types'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<IExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/accounting/categories')
    const data = await res.json()
    setCategories(data.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/accounting/categories/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      setDeleteTarget(null)
      fetchCategories()
    } catch (err: unknown) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  const visibleCategories = showInactive
    ? categories
    : categories.filter(c => c.active)

  const expenseCategories = visibleCategories.filter(c => c.type === 'expense')
  const incomeCategories = visibleCategories.filter(c => c.type === 'income')

  function renderTable(cats: IExpenseCategory[], title: string) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <span className="text-xs text-gray-500">{cats.length} categories</span>
        </div>
        {cats.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No categories found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Schedule F Bucket', 'Active', 'Sort', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cats.map(cat => (
                <>
                  {editId === cat._id ? (
                    <tr key={`edit-${cat._id}`}>
                      <td colSpan={5} className="px-4 py-3">
                        <CategoryForm
                          initial={cat}
                          editId={cat._id}
                          onSaved={() => { setEditId(null); fetchCategories() }}
                          onCancel={() => setEditId(null)}
                        />
                      </td>
                    </tr>
                  ) : (
                    <tr key={cat._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">{cat.scheduleFBucket}</td>
                      <td className="px-4 py-3">
                        {cat.active
                          ? <Badge variant="green">Active</Badge>
                          : <Badge variant="gray">Inactive</Badge>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cat.sortOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => { setEditId(cat._id); setShowAdd(false) }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => { setDeleteTarget({ id: cat._id, name: cat.name }); setDeleteError('') }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <>
      <TopBar
        title="Categories"
        subtitle="Manage expense & income categories"
        actions={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Show inactive
            </label>
            <Button onClick={() => { setShowAdd(true); setEditId(null) }}>+ Add Category</Button>
          </div>
        }
      />
      <PageWrapper>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {showAdd && (
              <CategoryForm
                onSaved={() => { setShowAdd(false); fetchCategories() }}
                onCancel={() => setShowAdd(false)}
              />
            )}
            {renderTable(expenseCategories, 'Expense Categories')}
            {renderTable(incomeCategories, 'Income Categories')}
          </div>
        )}
      </PageWrapper>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        confirmLabel="Delete Category"
        confirmVariant="danger"
        loading={deleting}
        description={
          deleteError
            ? `Cannot delete: ${deleteError}`
            : `This will permanently delete the category "${deleteTarget?.name}". This cannot be undone.`
        }
      />
    </>
  )
}
