<script setup lang="ts">
/**
 * @file app/pages/login.vue
 * @description This is the login page for the application. It uses VeeValidate for form
 */


import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useForm, Field as VeeField } from 'vee-validate'
import { loginSchema } from '~~/shared/schemas/login.schema'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'no-sidebar',
})

const supabase = useSupabaseClient()

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: '',
    password: '',
  },
})

const onSubmit = handleSubmit(async (data) => {

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    console.error('Error logging in:', error)
    toast.error('Error logging in: ' + error.message)
    return
  }

  await navigateTo('/')

})
</script>

<template>
  <div class="flex w-full h-screen items-center justify-center">

    <Card class="w-full max-w-sm">
      <form id="login-form" @submit="onSubmit" class="flex flex-col gap-5">

        <CardHeader>
          <CardTitle>Entre na sua conta</CardTitle>
          <CardDescription>
            Digite seu email e senha para acessar sua conta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>

            <div class="grid w-full items-center gap-4">
              <div class="flex flex-col space-y-1.5">
                <VeeField v-slot="{ componentField, errors }" name="email">
                  <Field :data-invalid="!!errors.length">
                    <FieldLabel for="email">
                      Email
                    </FieldLabel>
                    <Input id="email" v-bind="componentField" placeholder="Digite seu email" autocomplete="off"
                      :aria-invalid="!!errors.length" />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
              </div>

              <div class="flex flex-col space-y-1.5">
                <div class="flex items-center">
                  <VeeField v-slot="{ componentField, errors }" name="password">
                    <Field :data-invalid="!!errors.length">
                      <FieldLabel for="password">
                        Senha
                      </FieldLabel>
                      <Input id="password" v-bind="componentField" type="password" placeholder="Sua senha"
                        autocomplete="off" :aria-invalid="!!errors.length" />
                      <FieldError v-if="errors.length" :errors="errors" />
                    </Field>

                  </VeeField>

                </div>
              </div>
            </div>
          </FieldGroup>

        </CardContent>

        <CardFooter class="flex flex-col gap-2">
          <Button class="w-full" type="submit">
            Entrar
          </Button>
          <Button variant="outline" class="w-full">
            Entrar com Google
          </Button>
        </CardFooter>
      </form>

    </Card>
  </div>

</template>
