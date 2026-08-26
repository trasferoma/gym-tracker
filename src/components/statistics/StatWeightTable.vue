<script setup lang="ts">
import { computed } from 'vue';

import type { StatSession } from '@/domain/statistics/statSessions';
import { formatWeight, formatWorkoutDayShort } from '@/presentation/italianFormat';

const props = defineProps<{ sessions: readonly StatSession[] }>();

const setCount = computed(() => props.sessions.reduce((max, session) => Math.max(max, session.weights.length), 0));
const setColumns = computed(() => Array.from({ length: setCount.value }, (_, index) => index + 1));
const rowsMostRecentFirst = computed(() => props.sessions.slice().reverse());

function weightLabel(session: StatSession, setNumber: number): string {
    const weight = session.weights[setNumber - 1];
    return weight === undefined ? '–' : formatWeight(weight);
}

function rowKey(session: StatSession): string {
    const weightsSuffix = session.weights.join('-');
    return `${session.workoutDate}-${weightsSuffix}`;
}
</script>

<template>
  <div class="card tbl-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>Data</th>
          <th
            v-for="setNumber in setColumns"
            :key="setNumber"
          >
            S{{ setNumber }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="session in rowsMostRecentFirst"
          :key="rowKey(session)"
        >
          <td class="date">
            {{ formatWorkoutDayShort(session.workoutDate) }}
          </td>
          <td
            v-for="setNumber in setColumns"
            :key="setNumber"
            class="num"
          >
            {{ weightLabel(session, setNumber) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="faint table-note">
    Peso in kg. Le ripetizioni sono fissate dallo schema, quindi non vengono ripetute su ogni riga.
  </p>
</template>

<style scoped>
.tbl-wrap {
    overflow-x: auto;
    margin-top: 12px;
}

table.tbl {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
    font-size: 13.5px;
}

table.tbl th,
table.tbl td {
    padding: 9px 6px;
    text-align: right;
    white-space: nowrap;
}

table.tbl th {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--text-faint);
    border-bottom: 1px solid var(--border);
}

table.tbl th:first-child,
table.tbl td:first-child {
    text-align: left;
    padding-left: 12px;
}

table.tbl th:last-child,
table.tbl td:last-child {
    padding-right: 12px;
}

table.tbl tbody tr + tr td {
    border-top: 1px solid var(--border);
}

table.tbl td.date {
    color: var(--text-dim);
    font-size: 12.5px;
    text-transform: capitalize;
}

table.tbl tbody tr:first-child td {
    font-weight: 700;
}

table.tbl tbody tr:first-child td.date {
    color: var(--text);
}

.table-note {
    font-size: 12px;
    margin: 9px 2px 0;
}
</style>
