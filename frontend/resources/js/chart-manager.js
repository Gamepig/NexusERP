import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const defaultPalette = () => {
  const css = getComputedStyle(document.documentElement);
  return {
    text: css.getPropertyValue('--nexus-text-primary').trim() || '#1f2937',
    grid: css.getPropertyValue('--nexus-border-secondary').trim() || '#e5e7eb',
    bg: css.getPropertyValue('--nexus-bg-secondary').trim() || '#f9fafb',
    primary: css.getPropertyValue('--nexus-primary-500').trim() || '#3b82f6',
    secondary: css.getPropertyValue('--nexus-purple-500').trim() || '#8b5cf6',
  };
};

export class ChartManager {
  constructor() {
    this.instances = new Map();
    this.handleThemeChange = this.handleThemeChange.bind(this);
    document.addEventListener('nexus-theme-changed', this.handleThemeChange);
  }

  create(id, config) {
    const ctx = document.getElementById(id);
    if (!ctx) return null;

    const palette = defaultPalette();
    const updated = this.applyTheme(config, palette);
    const chart = new Chart(ctx, updated);
    this.instances.set(id, { chart, config });
    return chart;
  }

  applyTheme(config, palette) {
    const next = JSON.parse(JSON.stringify(config));
    next.options = next.options || {};
    next.options.plugins = next.options.plugins || {};
    next.options.plugins.legend = next.options.plugins.legend || {};
    next.options.plugins.legend.labels = next.options.plugins.legend.labels || {};
    next.options.scales = next.options.scales || {};

    // axes color
    Object.values(next.options.scales).forEach(scale => {
      scale.ticks = scale.ticks || {};
      scale.grid = scale.grid || {};
      scale.ticks.color = palette.text;
      scale.grid.color = palette.grid;
    });

    // legend labels
    next.options.plugins.legend.labels.color = palette.text;

    // dataset defaults
    if (Array.isArray(next.data?.datasets)) {
      next.data.datasets = next.data.datasets.map((ds, i) => ({
        borderColor: ds.borderColor || (i % 2 === 0 ? palette.primary : palette.secondary),
        backgroundColor: ds.backgroundColor || (i % 2 === 0 ? palette.primary : palette.secondary),
        ...ds,
      }));
    }

    return next;
  }

  handleThemeChange() {
    const palette = defaultPalette();
    this.instances.forEach(({ chart, config }, id) => {
      const updated = this.applyTheme(config, palette);
      chart.options = updated.options;
      chart.data = updated.data;
      chart.update('none');
    });
  }

  destroy(id) {
    const entry = this.instances.get(id);
    if (entry) {
      entry.chart.destroy();
      this.instances.delete(id);
    }
  }
}

// global singleton (optional)
export const Charts = new ChartManager();


