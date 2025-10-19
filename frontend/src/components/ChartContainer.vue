<template>
  <div class="chart-box" :style="containerStyle" :data-chart-id="canvasId">
    <canvas :id="canvasId"></canvas>
  </div>
</template>

<script>
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, BarController } from 'chart.js'
import { getRelativePosition } from 'chart.js/helpers'

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
    onElementClick: {
      type: Function,
      default: null
    },
    onLabelHover: {
      type: Function,
      default: null
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
      chart: null,
      hoverIndex: null
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
    this.detachEventListeners()
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
    },
    chartOptions: {
      handler() {
        this.createChart()
      },
      deep: true
    },
    onElementClick() {
      if (!this.chart) return
      this.detachEventListeners()
      this.attachEventListeners()
    },
    onLabelHover() {
      if (!this.chart) return
      this.detachEventListeners()
      this.attachEventListeners()
    }
  },
  methods: {
    cloneConfig(value, seen = new WeakMap()) {
      if (value === null || typeof value !== 'object') {
        return value;
      }
      if (typeof value === 'function') {
        return value;
      }
      if (seen.has(value)) {
        return seen.get(value);
      }
      if (Array.isArray(value)) {
        const arr = [];
        seen.set(value, arr);
        value.forEach((item, index) => {
          arr[index] = this.cloneConfig(item, seen);
        });
        return arr;
      }
      const cloned = {};
      seen.set(value, cloned);
      Object.keys(value).forEach((key) => {
        cloned[key] = this.cloneConfig(value[key], seen);
      });
      return cloned;
    },
    resolveInteraction(event) {
      if (!this.chart) return null
      const labels = this.chart.data.labels || []
      if (!labels.length) return null

      let elements = this.chart.getElementsAtEventForMode(
        event,
        'nearest',
        { axis: 'y', intersect: false },
        true
      )

      let datasetIndex = elements?.[0]?.datasetIndex ?? 0
      let index = elements?.[0]?.index

      if (index == null || index < 0 || index >= labels.length) {
        const yScale = this.chart.scales?.y
        if (yScale && typeof yScale.getValueForPixel === 'function') {
          const position = getRelativePosition(event, this.chart)
          const rawValue = yScale.getValueForPixel(position.y)

          if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
            index = Math.round(rawValue)
          } else if (rawValue !== undefined && rawValue !== null) {
            index = labels.indexOf(rawValue)
          }
        }
      }

      if (index == null || index < 0 || index >= labels.length) {
        return null
      }

      return {
        datasetIndex: datasetIndex >= 0 ? datasetIndex : 0,
        index
      }
    },
    handleCanvasClick(event) {
      if (!this.onElementClick) return
      const result = this.resolveInteraction(event)
      if (!result) return

      const { datasetIndex, index } = result
      const dataset = this.chartData.datasets?.[datasetIndex]
      const label = this.chartData.labels?.[index]
      const value = dataset ? dataset.data?.[index] : undefined
      this.onElementClick({ datasetIndex, index, label, value, event })
    },
    handleCanvasMove(event) {
      if (!this.chart) return
      const result = this.resolveInteraction(event)
      const canvas = this.chart.canvas

      if (this.onElementClick) {
        canvas.style.cursor = result ? 'pointer' : ''
      }

      if (!this.onLabelHover) {
        this.hoverIndex = result ? result.index : null
        return
      }

      const nextIndex = result ? result.index : null
      if (this.hoverIndex !== nextIndex) {
        this.hoverIndex = nextIndex
        this.onLabelHover(nextIndex)
        this.chart.draw()
      }
    },
    handleCanvasLeave() {
      if (!this.chart) return
      const canvas = this.chart.canvas
      if (this.onElementClick) {
        canvas.style.cursor = ''
      }
      if (this.onLabelHover && this.hoverIndex !== null) {
        this.hoverIndex = null
        this.onLabelHover(null)
        this.chart.draw()
      }
    },
    setActiveIndex(index) {
      if (!this.chart || index == null || index < 0) return
      const activeElements = this.chart.data.datasets.map((_, datasetIndex) => ({ datasetIndex, index }))
      this.chart.setActiveElements(activeElements)
      if (this.chart.tooltip && activeElements.length) {
        const firstMeta = this.chart.getDatasetMeta(activeElements[0].datasetIndex)
        const element = firstMeta?.data?.[index]
        if (element) {
          const { x, y } = element.getProps(['x', 'y'], true)
          this.chart.tooltip.setActiveElements(activeElements, { x, y })
        }
      }
      this.chart.update()
    },
    clearActiveElements() {
      if (!this.chart) return
      this.chart.setActiveElements([])
      if (this.chart.tooltip) {
        this.chart.tooltip.setActiveElements([], { x: 0, y: 0 })
      }
      this.hoverIndex = null
      this.chart.update()
    },
    getElementBounds(index) {
      if (!this.chart || index == null || index < 0) return null
      const datasets = this.chart.data?.datasets || []
      for (let datasetIndex = 0; datasetIndex < datasets.length; datasetIndex += 1) {
        if (!this.chart.isDatasetVisible(datasetIndex)) continue
        const meta = this.chart.getDatasetMeta(datasetIndex)
        const element = meta?.data?.[index]
        if (!element) continue

        const props = typeof element.getProps === 'function'
          ? element.getProps(['y', 'height'], true)
          : { y: element.y, height: element.height }

        const center = props?.y
        const height = props?.height ?? 0
        if (typeof center !== 'number' || !Number.isFinite(center)) continue

        const half = Number.isFinite(height) ? height / 2 : 0
        return {
          top: center - half,
          bottom: center + half,
          center,
          height
        }
      }
      const area = this.chart.chartArea
      const total = this.chart.data?.labels?.length || 0
      if (area && total > 0 && index < total) {
        const step = (area.bottom - area.top) / total
        const center = area.top + step * (index + 0.5)
        const half = step / 2
        return {
          top: center - half,
          bottom: center + half,
          center,
          height: step
        }
      }
      return null
    },
    attachEventListeners() {
      const canvas = this.chart?.canvas
      if (!canvas) return

      if (this.onElementClick) {
        canvas.addEventListener('click', this.handleCanvasClick)
      }

      if (this.onLabelHover || this.onElementClick) {
        canvas.addEventListener('mousemove', this.handleCanvasMove)
        canvas.addEventListener('mouseleave', this.handleCanvasLeave)
      }
    },
    detachEventListeners() {
      const canvas = this.chart?.canvas
      if (!canvas) return

      canvas.removeEventListener('click', this.handleCanvasClick)
      canvas.removeEventListener('mousemove', this.handleCanvasMove)
      canvas.removeEventListener('mouseleave', this.handleCanvasLeave)
      if (this.onElementClick) {
        canvas.style.cursor = ''
      }
    },
    createChart() {
      const canvas = document.getElementById(this.canvasId)
      if (!canvas) return

      this.detachEventListeners()

      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }

      const ctx = canvas.getContext('2d')
      canvas.width = this.width
      canvas.height = this.height
      canvas.style.width = `${this.width}px`
      canvas.style.height = `${this.height}px`

      const config = {
        type: 'bar',
        data: this.cloneConfig(this.chartData),
        options: {
          ...this.cloneConfig(this.chartOptions),
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            duration: 0
          },
          events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
          onResize: () => {}
        }
      }

      this.chart = new ChartJS(ctx, config)
      this.hoverIndex = null
      if (this.onLabelHover) {
        this.onLabelHover(null)
      }
      this.attachEventListeners()
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
