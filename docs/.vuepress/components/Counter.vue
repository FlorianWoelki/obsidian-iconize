<script setup>
import { ref } from 'vue';

const number = ref(0);
</script>

<template>
  <div class="counter">
    <h1>{{ number }}</h1>
    <button @click="number++">Increment</button>
    <button @click="number--">Decrement</button>
  </div>
</template>
