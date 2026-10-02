<script setup lang="ts">
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

const supabase = useSupabaseClient()

const { handleSubmit } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: {
    email: '',
    password: '',
  },
})

const onSubmit = handleSubmit(async (data) => {
  toast('You submitted the following values:', {
    description: h('pre', { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' }, h('code', JSON.stringify(data, null, 2))),
    position: 'bottom-right',
    class: 'flex flex-col gap-2',
    style: {
      '--border-radius': 'calc(var(--radius)  + 4px)',
    },
  })
  const { data: user, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  toast('Login successful!', {
    description: h('pre', { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' }, h('code', JSON.stringify(user, null, 2))),
    position: 'bottom-right',
    class: 'flex flex-col gap-2',
    style: {
      '--border-radius': 'calc(var(--radius)  + 4px)',
    },
  })
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
