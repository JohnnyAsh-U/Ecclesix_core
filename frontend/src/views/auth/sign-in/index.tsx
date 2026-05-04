import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { useState } from 'react'
import LoginForm from './components/login-form'
import { Verify2FAForm } from './components/verify-otp'

export function SignIn() {
  const [page, setPage] = useState<'login' | '2fa'>('login')
  const [tempToken, setTempToken] = useState('')

  return (
    <AuthLayout>
      {page == "login" &&
        <Card className='gap-4'>
          <CardHeader>
            <CardTitle className='text-lg tracking-tight'>Connexion</CardTitle>
            <CardDescription>
              Entrez votre nom d'utilisateur et mot de passe ci-dessous pour <br />
              vous connecter à votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm setPage={setPage} setToken={setTempToken} />
          </CardContent>
          <CardFooter>
            <p className='text-center text-sm text-muted-foreground'>
              <a
                href='/terms'
                className='underline underline-offset-4 hover:text-primary'
              >
                @AshicoreLabs
              </a>{' '}
            </p>
          </CardFooter>
        </Card>}

      {page == '2fa' && <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Authentication à deux facteurs
          </CardTitle>
          <CardDescription>
            Entrez le code de 6 chiffres de votre application
            <br />
            d'authentification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Verify2FAForm tempToken={tempToken} />
        </CardContent>
        <CardFooter>
          <p className='text-center text-sm text-muted-foreground'>
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              @AshicoreLabs
            </a>{' '}
          </p>
        </CardFooter>
      </Card>}
    </AuthLayout>
  )
}
