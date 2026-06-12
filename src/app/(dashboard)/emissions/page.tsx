import { EmissionForm } from '@/components/emissions/EmissionForm'

export default function EmissionsPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Emission Records</h1>
      <EmissionForm />
    </main>
  )
}
