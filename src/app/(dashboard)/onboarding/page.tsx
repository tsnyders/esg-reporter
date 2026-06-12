import { CompanyStep } from '@/components/onboarding/CompanyStep'

export default function OnboardingPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Company Setup</h1>
      <CompanyStep />
    </main>
  )
}
