<template>
  <div class="chart-box" :style="containerStyle">
    <canvas :id="canvasId"></canvas>
  </div>
</template>

<script>
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, BarController } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, BarController)

export default {
  name: 'ChartContainer',
  props: {
    canvasId: {
      type: String,
      required: true
    },
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      default: () => ({})
    },
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 300
    }
  },
  data() {
    return {
      chart: null
    }
  },
  computed: {
    containerStyle() {
      return {
        width: `${this.width}px`,
        height: `${this.height}px`
      }
    }
  },
  mounted() {
    this.createChart()
  },
  beforeUnmount() {
    if (this.chart) {
      this.chart.destroy()
      this.chart = null
    }
  },
  watch: {
    chartData: {
      handler() {
        this.createChart()
      },
      deep: true
    }
  },
  methods: {
    createChart() {
      const canvas = document.getElementById(this.canvasId)
      if (!canvas) return
      
      // Destroy existing chart
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
      
      // Set canvas size explicitly
      const ctx = canvas.getContext('2d')
      canvas.width = this.width
      canvas.height = this.height
      canvas.style.width = `${this.width}px`
      canvas.style.height = `${this.height}px`
      
      // Create new chart with fixed dimensions
      this.chart = new ChartJS(ctx, {
        type: 'bar',
        data: this.chartData,
        options: {
          ...this.chartOptions,
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0
          },
          events: ['click', 'mousemove'], // Limit events
          onResize: () => {} // Prevent resize
        }
      })
    }
  }
}
</script>

<style scoped>
.chart-box {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.chart-box canvas {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  pointer-events: auto !important;
}
</style>