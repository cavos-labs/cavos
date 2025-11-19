import localFont from 'next/font/local'
import { Geist } from 'next/font/google'

export const romagothicbold = localFont({
  src: '../app/fonts/Ramagothicbold.ttf',
  variable: '--font-romagothicbold',
  display: 'swap',
})

export const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})
