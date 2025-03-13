import { invoke } from '@tauri-apps/api/core'
import { Menu } from '@tauri-apps/api/menu'
import { TrayIcon } from '@tauri-apps/api/tray'
import { getCurrentWindow, Window } from '@tauri-apps/api/window'
import { exit } from '@tauri-apps/plugin-process'
import { useEffect } from 'react'

export const useTray = () => {
  let tray: TrayIcon | undefined
  let appWindow: Window | undefined

  const showWindow = async () => {
    if (!appWindow) return

    await invoke('toggle_dock_icon', { show: true })

    await appWindow.show()
    await appWindow.setFocus()
  }

  const handleShowClick = async () => {
    await showWindow()
  }

  const handleQuitClick = async () => {
    await exit(0)
  }

  const setupWindowBehavior = async () => {
    if (!appWindow) return

    appWindow.onCloseRequested(async (event) => {
      if (!appWindow) return

      event.preventDefault()
      await appWindow.hide()
      await appWindow.setSkipTaskbar(true)

      await invoke('toggle_dock_icon', { show: false })
    })
  }

  useEffect(() => {
    const initTray = async () => {
      appWindow = getCurrentWindow()

      await setupWindowBehavior()

      const menu = await Menu.new({
        items: [
          {
            id: 'show',
            text: 'Show',
            action: handleShowClick,
          },
          {
            id: 'quit',
            text: 'Quit',
            action: handleQuitClick,
          },
        ],
      })

      tray = await TrayIcon.new({
        title: 'Assist',
        tooltip: 'Assist',
        menu,
      })
    }

    initTray()

    return () => {
      tray?.close()
    }
  }, [])
}
