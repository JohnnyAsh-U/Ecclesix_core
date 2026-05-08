import React, { useState } from 'react'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeCanvas } from 'qrcode.react'
import { useMeQuery, useSetup2FAMutation, useEnable2FAMutation, useDisable2FAMutation, useChangePasswordMutation, useUpdateProfileMutation } from '@/hooks/auth.hooks'

type Props = {}

export default function Profile({ }: Props) {
    const { data: currentUser, isLoading: isLoadingUser } = useMeQuery()
    const changePasswordMut = useChangePasswordMutation()
    const updateProfileMut = useUpdateProfileMutation()
    const setup2FAMut = useSetup2FAMutation()
    const enable2FAMut = useEnable2FAMutation()
    const disable2FAMut = useDisable2FAMutation()

    const [editMode, setEditMode] = useState(false)
    const [editFormData, setEditFormData] = useState({
        username: '',
        email: '',
        phone: '',
    })
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [twoFADialogOpen, setTwoFADialogOpen] = useState(false)
    const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false })
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [twoFASecret, setTwoFASecret] = useState<string>('')
    const [twoFAQRCode, setTwoFAQRCode] = useState<string>('')
    const [twoFACode, setTwoFACode] = useState('')

    React.useEffect(() => {
        if (currentUser) {
            setEditFormData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
            })
        }
    }, [currentUser])

    const handleEditProfile = async () => {
        if (!editFormData.username.trim() || !editFormData.email.trim()) {
            toast.error('Veuillez remplir tous les champs obligatoires')
            return
        }
        try {
            await updateProfileMut.mutateAsync(editFormData)
            setEditMode(false)
            toast.success('Profil mis à jour avec succès')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour')
        }
    }

    const handleCancelEdit = () => {
        if (currentUser) {
            setEditFormData({
                username: currentUser.username || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
            })
        }
        setEditMode(false)
    }

    const handleChangePassword = async () => {
        if (!passwordForm.oldPassword.trim()) {
            toast.error('Veuillez entrer votre mot de passe actuel')
            return
        }
        if (!passwordForm.newPassword.trim()) {
            toast.error('Veuillez entrer un nouveau mot de passe')
            return
        }
        if (passwordForm.newPassword.length < 8) {
            toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas')
            return
        }
        if (passwordForm.oldPassword === passwordForm.newPassword) {
            toast.error('Le nouveau mot de passe doit être différent du mot de passe actuel')
            return
        }
        try {
            await changePasswordMut.mutateAsync({
                old_password: passwordForm.oldPassword,
                new_password: passwordForm.newPassword,
            })
            toast.success('Mot de passe changé avec succès')
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
            setPasswordDialogOpen(false)
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Erreur lors du changement de mot de passe')
        }
    }

    const handleSetup2FA = async () => {
        try {
            const response = await setup2FAMut.mutateAsync()
            setTwoFASecret(response.secret)
            setTwoFAQRCode(response.otpauth_url)
        } catch (error: any) {
            toast.error('Erreur lors de la configuration de l\'authentification 2FA')
        }
    }

    const handleEnableTwoFA = async () => {
        if (!twoFACode.trim()) {
            toast.error('Veuillez entrer le code à 6 chiffres de votre authenticateur')
            return
        }
        if (twoFACode.length !== 6 || !/^\d+$/.test(twoFACode)) {
            toast.error('Veuillez entrer un code valide à 6 chiffres')
            return
        }
        try {
            await enable2FAMut.mutateAsync(twoFACode)
            setTwoFACode('')
            setTwoFADialogOpen(false)
            toast.success('Authentification à deux facteurs activée avec succès')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Erreur lors de l\'activation de 2FA')
        }
    }

    const handleDisableTwoFA = async () => {
        try {
            const code = prompt('Veuillez entrer le code à 6 chiffres de votre authenticateur pour désactiver 2FA:')
            if (!code) return
            await disable2FAMut.mutateAsync(code)
            toast.success('Authentification à deux facteurs désactivée')
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Erreur lors de la désactivation de 2FA')
        }
    }

    const handleCopySecret = () => {
        navigator.clipboard.writeText(twoFASecret)
        toast.success('Clé secrète copiée dans le presse-papiers')
    }

    const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
    }

    if (isLoadingUser) {
        return (
            <Main>
                <div className='flex items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin' />
                </div>
            </Main>
        )
    }

    return (
        <Main>
            <div>
                <h1 className='text-2xl font-bold tracking-tight'>Profil</h1>
                <p className='text-muted-foreground'>
                    Gérez vos <b>informations</b> de compte, <b>mot de passe</b> et <b>paramètres de sécurité</b>
                </p>
            </div>

            <div className='mt-6'>
                <Tabs defaultValue='information' className='w-full'>
                    <TabsList>
                        <TabsTrigger value='information'>
                            <User className='h-4 w-4 mr-2' />
                            Informations
                        </TabsTrigger>
                        <TabsTrigger value='security'>
                            <Shield className='h-4 w-4 mr-2' />
                            Sécurité
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value='information' className='mt-4'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations personnelles</CardTitle>
                                <CardDescription>Mettez à jour vos détails de profil</CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-6'>
                                <div className='grid grid-cols-2 gap-4'>
                                    <div>
                                        <label className='text-sm font-semibold block mb-2'>Nom Utilisateur</label>
                                        {editMode ? (
                                            <input type='text' value={editFormData.username} onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })} className='w-full rounded border px-3 py-2 text-sm' />
                                        ) : (
                                            <p className='text-sm px-3 py-2 bg-muted rounded'>{currentUser?.username || '-'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className='text-sm font-semibold block mb-2'>Email</label>
                                        {editMode ? (
                                            <input type='email' value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className='w-full rounded border px-3 py-2 text-sm' />
                                        ) : (
                                            <p className='text-sm px-3 py-2 bg-muted rounded'>{currentUser?.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className='grid grid-cols-3 gap-3'>
                                    <div>
                                        <label className='text-sm font-semibold block mb-2'>Téléphone</label>
                                        {editMode ? (
                                            <input type='tel' value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className='w-full rounded border px-3 py-2 text-sm' />
                                        ) : (
                                            <p className='text-sm px-3 py-2 bg-muted rounded'>{currentUser?.phone || '-'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className='text-sm font-semibold block mb-2'>Rôle</label>
                                        <p className='text-sm px-3 py-2 bg-muted rounded text-blue-700 font-medium'>{currentUser?.role || '-'}</p>
                                    </div>
                                    <div>
                                        <label className='text-sm font-semibold block mb-2'>2FA</label>
                                        <p className='text-sm px-3 py-2 bg-muted rounded'>
                                            {currentUser?.is_2fa_enabled ? <span className='text-green-600 font-semibold'>✓ Activé</span> : <span className='text-yellow-600 font-semibold'>○ Désactivé</span>}
                                        </p>
                                    </div>
                                </div>


                                <div className='flex gap-2 pt-4'>
                                    {editMode ? (
                                        <>
                                            <Button onClick={handleEditProfile} disabled={updateProfileMut.isPending}>
                                                {updateProfileMut.isPending ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' />Enregistrement...</>) : ('Enregistrer les modifications')}
                                            </Button>
                                            <Button variant='outline' onClick={handleCancelEdit}>Annuler</Button>
                                        </>
                                    ) : (
                                        <Button onClick={() => setEditMode(true)}>Modifier le profil</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value='security' className='mt-4 space-y-6'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Changer le mot de passe</CardTitle>
                                <CardDescription>Mettez à jour régulièrement votre mot de passe pour sécuriser votre compte</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={() => setPasswordDialogOpen(true)}>
                                    <Lock className='h-4 w-4 mr-2' />
                                    Changer le mot de passe
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Authentification à deux facteurs</CardTitle>
                                <CardDescription>Ajoutez une couche de sécurité supplémentaire à votre compte</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className='space-y-4'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <p className='font-medium'>Statut</p>
                                            <p className='text-sm text-muted-foreground'>
                                                {currentUser?.is_2fa_enabled ? <span className='text-green-600 font-semibold'>✓ Activé</span> : <span className='text-yellow-600 font-semibold'>○ Désactivé</span>}
                                            </p>
                                        </div>
                                        {!currentUser?.is_2fa_enabled ? (
                                            <Button onClick={() => { handleSetup2FA(); setTwoFADialogOpen(true) }}>
                                                <Shield className='h-4 w-4 mr-2' />
                                                Activer 2FA
                                            </Button>
                                        ) : (
                                            <Button variant='destructive' onClick={handleDisableTwoFA} disabled={disable2FAMut.isPending}>
                                                {disable2FAMut.isPending ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' />Désactivation...</>) : ('Désactiver 2FA')}
                                            </Button>
                                        )}
                                    </div>
                                   
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>Changer le mot de passe</DialogTitle>
                    </DialogHeader>
                    <div className='mt-4 space-y-4'>
                        <div>
                            <label className='text-sm font-semibold block mb-2'>Mot de passe actuel</label>
                            <div className='relative'>
                                <input type={showPasswords.old ? 'text' : 'password'} placeholder='Entrez votre mot de passe actuel' value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} className='w-full rounded border px-3 py-2 text-sm pr-10' />
                                <button onClick={() => togglePasswordVisibility('old')} className='absolute right-3 top-2.5 text-muted-foreground hover:text-foreground'>
                                    {showPasswords.old ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className='text-sm font-semibold block mb-2'>Nouveau mot de passe</label>
                            <div className='relative'>
                                <input type={showPasswords.new ? 'text' : 'password'} placeholder='Entrez un nouveau mot de passe' value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className='w-full rounded border px-3 py-2 text-sm pr-10' />
                                <button onClick={() => togglePasswordVisibility('new')} className='absolute right-3 top-2.5 text-muted-foreground hover:text-foreground'>
                                    {showPasswords.new ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                </button>
                            </div>
                            <p className='text-xs text-muted-foreground mt-1'>Minimum 8 caractères</p>
                        </div>
                        <div>
                            <label className='text-sm font-semibold block mb-2'>Confirmer le nouveau mot de passe</label>
                            <div className='relative'>
                                <input type={showPasswords.confirm ? 'text' : 'password'} placeholder='Confirmez votre nouveau mot de passe' value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className='w-full rounded border px-3 py-2 text-sm pr-10' />
                                <button onClick={() => togglePasswordVisibility('confirm')} className='absolute right-3 top-2.5 text-muted-foreground hover:text-foreground'>
                                    {showPasswords.confirm ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setPasswordDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleChangePassword} disabled={changePasswordMut.isPending}>
                            {changePasswordMut.isPending ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' />Modification...</>) : ('Changer le mot de passe')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
                <DialogContent className='sm:max-w-lg max-h-screen overflow-y-auto'>
                    <DialogHeader>
                        <DialogTitle>Configurer l\'authentification à deux facteurs</DialogTitle>
                    </DialogHeader>
                    <div className='mt-4 space-y-4'>
                        {setup2FAMut.isPending ? (
                            <div className='flex justify-center py-8'><Loader2 className='h-8 w-8 animate-spin' /></div>
                        ) : (
                            <>
                                <div>
                                    <p className='text-sm font-semibold mb-2'>Étape 1 : Scannez le code QR</p>
                                    <p className='text-xs text-muted-foreground mb-3'>Scannez ce code QR avec une application d\'authentification comme Google Authenticator, Microsoft Authenticator ou Authy :</p>
                                    <div className='flex justify-center bg-muted p-4 rounded'>
                                        {twoFAQRCode && <QRCodeCanvas value={twoFAQRCode} size={200} level='H' includeMargin={true} />}
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm font-semibold mb-2'>Étape 2 : Entrée manuelle (si le code QR ne fonctionne pas)</p>
                                    <p className='text-xs text-muted-foreground mb-2'>Entrez cette clé manuellement dans votre application d\'authentification :</p>
                                    <div className='flex items-center gap-2 bg-muted p-3 rounded'>
                                        <code className='flex-1 text-xs font-mono'>{twoFASecret}</code>
                                        <button onClick={handleCopySecret} className='text-blue-600 hover:text-blue-700 text-xs'>Copier</button>
                                    </div>
                                </div>
                                <div>
                                    <p className='text-sm font-semibold mb-2'>Étape 3 : Vérification</p>
                                    <p className='text-xs text-muted-foreground mb-2'>Entrez le code à 6 chiffres de votre application d\'authentification :</p>
                                    <input type='text' placeholder='000000' value={twoFACode} onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} className='w-full rounded border px-3 py-2 text-sm text-center font-mono tracking-wider' />
                                </div>
                                
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setTwoFADialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleEnableTwoFA} disabled={enable2FAMut.isPending}>
                            {enable2FAMut.isPending ? (<><Loader2 className='h-4 w-4 mr-2 animate-spin' />Activation...</>) : ('Activer 2FA')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Main>
    )
}
