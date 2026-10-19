<script setup lang="ts">
/**
 * @file app/components/ResponsiveModal.vue
 * @description This component provides a responsive modal that adapts to different screen sizes. It uses the Dialog component for desktop screens and the Drawer component for mobile screens. The modal can be triggered by a button or any other element passed as a slot. It also allows for customizable titles, descriptions, and footers through props and slots.
 * @version 1.0.0
 * @author Alessandro Pinheiro
 * @license MIT
 */

import { useMediaQuery, useVModel } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

// Permite que o componente pai passe o título e descrição
const props = defineProps<{
  title?: string
  description?: string
  open?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isOpen = useVModel(props, 'open', emit, {
  passive: true,
  defaultValue: false,
})

const isDesktop = useMediaQuery('(min-width: 640px)')

const Modal = computed(() => ({
  Root: isDesktop.value ? Dialog : Drawer,
  Trigger: isDesktop.value ? DialogTrigger : DrawerTrigger,
  Content: isDesktop.value ? DialogContent : DrawerContent,
  Header: isDesktop.value ? DialogHeader : DrawerHeader,
  Title: isDesktop.value ? DialogTitle : DrawerTitle,
  Description: isDesktop.value ? DialogDescription : DrawerDescription,
  Footer: isDesktop.value ? DialogFooter : DrawerFooter,
  Close: isDesktop.value ? DialogClose : DrawerClose,
}))
</script>

<template>
  <component :is="Modal.Root" v-model:open="isOpen">
    <!-- SLOT: Botão/Gatilho -->
    <!-- O `as-child` delega o clique e atributos para o componente que o pai enviar -->
    <component :is="Modal.Trigger" as-child>
      <slot name="trigger" />
    </component>

    <component
      :is="Modal.Content"
      class="sm:max-w-md"
      :class="[{ 'px-2 pb-8 *:px-4': !isDesktop }]"
    >
      <component :is="Modal.Header">
        <component :is="Modal.Title">
          <!-- Pode usar a prop "title" ou passar um slot para um título customizado -->
          <slot name="title">{{ title }}</slot>
        </component>
        <component :is="Modal.Description">
          <slot name="description">{{ description }}</slot>
        </component>
      </component>

      <!-- SLOT DEFAULT: Formulário / Conteúdo Interno -->
      <div class="py-4">
        <slot />
      </div>

      <!-- SLOT: Rodapé (Opcional, possui botão de fechar por padrão) -->
      <component :is="Modal.Footer" class="pt-4">
        <slot name="footer">
          <component :is="Modal.Close" as-child>
            <Button variant="outline"> Fechar </Button>
          </component>
        </slot>
      </component>
    </component>
  </component>
</template>
