import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/profil/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/profil/"!</div>
}
