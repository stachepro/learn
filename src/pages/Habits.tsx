import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import HabitCreationFlow from '../components/habits/HabitCreationFlow'
import HabitOverviewCard from '../components/habits/HabitOverviewCard'
import {
  CategoryManagementSheet,
  HabitActionsSheet,
  HabitDeleteDialog,
} from '../components/habits/HabitManagementSheets'
import AppButton from '../components/ui/AppButton'
import PageHeader from '../components/ui/PageHeader'
import SurfaceCard from '../components/ui/SurfaceCard'
import type { Habit } from '../types'
import { todayStr } from '../utils/date'
import { buildHabitOverview } from '../utils/habitOverview'
import { showToast } from '../utils/toast'
import LuupiIcon from '../components/ui/LuupiIcon'

export default function Habits() {
  const { habits, logs, deleteHabit, categories, deleteCustomCategory } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [managedHabit, setManagedHabit] = useState<Habit | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Habit | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    setShowCreateFlow(true)
    navigate('/habits', { replace: true })
  }, [navigate, searchParams])

  const customCategories = categories.filter((category) => category.isCustom)
  const logicalToday = todayStr()

  const confirmHabitDeletion = () => {
    if (!confirmDelete) return
    const deletedName = confirmDelete.name
    deleteHabit(confirmDelete.id)
    setConfirmDelete(null)
    showToast({
      tone: 'info',
      icon: '−',
      title: 'Alışkanlık silindi',
      message: deletedName,
      haptic: 'light',
    })
  }

  const removeCustomCategory = (id: string) => {
    const category = customCategories.find((item) => item.id === id)
    deleteCustomCategory(id)
    showToast({
      tone: 'info',
      contextIcon: category ? <LuupiIcon name={category.icon} size={16} /> : undefined,
      title: 'Kategori silindi',
      message: category?.name,
      haptic: 'light',
    })
  }

  return (
    <>
      {showCreateFlow && <HabitCreationFlow onClose={() => setShowCreateFlow(false)} />}
      {editHabit && <HabitCreationFlow onClose={() => setEditHabit(null)} editHabit={editHabit} />}

      {managedHabit && (
        <HabitActionsSheet
          habit={managedHabit}
          category={categories.find((category) => category.id === managedHabit.categoryId)}
          onClose={() => setManagedHabit(null)}
          onEdit={() => setEditHabit(managedHabit)}
          onDelete={() => setConfirmDelete(managedHabit)}
        />
      )}
      {confirmDelete && (
        <HabitDeleteDialog habit={confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={confirmHabitDeletion} />
      )}
      {showCategories && (
        <CategoryManagementSheet
          categories={customCategories}
          onClose={() => setShowCategories(false)}
          onDelete={removeCustomCategory}
        />
      )}

      <div className="habits-overview-page max-w-3xl mx-auto px-4 pt-6">
        <PageHeader
          title="Alışkanlıklar"
          subtitle={`${habits.length} alışkanlık tanımlı`}
          action={(
            <div className="habits-overview-page__actions">
              <button type="button" className="habits-overview-page__manage" onClick={() => setShowCategories(true)} aria-label="Özel kategorileri yönet">•••</button>
              <AppButton tone="primary" size="sm" haptic="light" onClick={() => setShowCreateFlow(true)}>+ Ekle</AppButton>
            </div>
          )}
        />

        {habits.length === 0 ? (
          <SurfaceCard variant="hero" interactive onClick={() => setShowCreateFlow(true)} className="habits-overview-empty">
            <span className="habits-overview-empty__totem" aria-hidden><LuupiIcon name="seedling" size={48} /></span>
            <h2>İlk alışkanlığını oluştur</h2>
            <p>Ritmini takip etmeye başlamak için ilk kartını ekle.</p>
            <span className="habits-overview-empty__action">Alışkanlık ekle →</span>
          </SurfaceCard>
        ) : (
          <main className="habit-overview-gallery" aria-label="Alışkanlık portföyü">
            {habits.map((habit, index) => {
              const category = categories.find((item) => item.id === habit.categoryId)
              return (
                <HabitOverviewCard
                  key={habit.id}
                  habit={habit}
                  category={category}
                  overview={buildHabitOverview(habit, logs, logicalToday)}
                  index={index}
                  onOpen={() => navigate(`/habit/${habit.id}/stats`)}
                  onManage={() => setManagedHabit(habit)}
                />
              )
            })}
          </main>
        )}
      </div>
    </>
  )
}
