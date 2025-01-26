import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { FC } from 'react'
import { Line } from 'react-chartjs-2'
import { Projection } from '../data-types'
import { ProjectionLogic } from '../projection-logic'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  projection: Projection
}

const ProjectionChart: FC<Props> = ({ projection }) => {
  // Prepare chart data
  const labels = projection.map((p) => `Year ${p.year}`)
  const totalAssetsData = projection.map(
    (p) => p.amountInvested + p.amountInRRSP + p.amountInTFSA
  )
  const investData = projection.map((p) => p.amountInvested)
  const rrspData = projection.map((p) => p.amountInRRSP)
  const tfsaData = projection.map((p) => p.amountInTFSA)

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Assets',
        data: totalAssetsData,
        borderColor: '#646cff',
        backgroundColor: 'rgba(100,108,255,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Non-Reg',
        data: investData,
        borderColor: '#ff6464',
        backgroundColor: 'rgba(255,100,100,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'RRSP',
        data: rrspData,
        borderColor: '#64ff64',
        backgroundColor: 'rgba(100,255,100,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'TFSA',
        data: tfsaData,
        borderColor: '#ffb164',
        backgroundColor: 'rgba(255,177,100,0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      y: {
        ticks: {
          callback: (value) => ProjectionLogic.formatMoney(Number(value)),
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.parsed.y || 0
            return `${context.dataset.label}: ${ProjectionLogic.formatMoney(
              val
            )}`
          },
        },
      },
    },
  }

  return (
    <div className="chart-container">
      <Line data={data} options={options} />
    </div>
  )
}

export default ProjectionChart
