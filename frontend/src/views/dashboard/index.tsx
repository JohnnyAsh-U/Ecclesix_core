import React from 'react'
import { Main } from '@/components/layout/main'


type Props = {}

export default function Dashboard({ }: Props) {
    return (
        <Main fixed>
            <div>
                <h1 className='text-2xl font-bold tracking-tight'>Tableau de Bord</h1>
                <p className='text-muted-foreground'>
                    Les Stats
                </p>
            </div>
        </Main>
    )
}