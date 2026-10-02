<script setup lang="ts">
import { PlusCircle } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { columns, type Payment } from '~/components/monitored-inventory/columns'
import DataTable from '~/components/monitored-inventory/data-table.vue'

const data = ref<Payment[]>([])

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      email: 'm@example.com',
    },
    // ...
  ]
}

onMounted(async () => {
  data.value = await getData()
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-row gap-5 justify-between">
      <h1 class="text-2xl font-bold">
        Monitoramento de Estoque
      </h1>
      <Button>
        <PlusCircle />
        Adicionar Produto
      </Button>
    </div>

    <div class="container mx-auto">
      <DataTable :columns="columns" :data="data" />
    </div>
  </div>
</template>
