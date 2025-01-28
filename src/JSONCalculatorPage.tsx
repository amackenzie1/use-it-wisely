import React, { useState } from 'react'
// IMPORTANT: You must have these next two imports from your own files
import { calculateProjectionFromData } from './PureCalculator'
import { CalculatorInputData } from './types'

// Recharts components:
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const JSONCalculatorPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('')
  const [projection, setProjection] = useState<any[]>([])
  const [maxWithdrawal, setMaxWithdrawal] = useState(0)
  const [error, setError] = useState('')

  // Handler: parse the user's JSON, then call the calculator
  const handleCompute = () => {
    try {
      setError('')
      const dataObj: CalculatorInputData = JSON.parse(jsonInput)
      const { projection: finalProjection, maxWithdrawal } =
        calculateProjectionFromData(dataObj)

      // Log the full projection data
      console.log('Projection Data:', finalProjection)
      
      // Clear previous data before setting new values
      setProjection([])
      setMaxWithdrawal(0)
      
      // Use setTimeout to ensure state is cleared before setting new values
      setTimeout(() => {
        setProjection(finalProjection)
        setMaxWithdrawal(maxWithdrawal)
      }, 0)
    } catch (e: any) {
      // Show parse errors, etc.
      setError(e.message)
      setProjection([])
      setMaxWithdrawal(0)
    }
  }

  // Convert your projection rows into something Recharts can display
  // For example, let's show a "total assets" line over time:
  const chartData = projection.map((row: any) => {
    const totalAssets =
      row.amountInvested + row.amountInRRSP + row.amountInTFSA
    return {
      year: row.calendarYear, // x-axis
      totalAssets, // y-axis
    }
  })

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* TOP: JSON input box */}
      <div style={{ width: '400px' }}>
        <h2>Paste Your JSON:</h2>
        <textarea
          rows={15}
          cols={50}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          style={{ width: '100%' }}
        />
        <br />
        <button onClick={handleCompute}>Compute Projection</button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>

      {/* BOTTOM: Chart + Results */}
      <div style={{ width: '100%' }}>
        <h2>Results</h2>
        {projection.length === 0 ? (
          <p>No projection yet. Paste JSON and click Compute.</p>
        ) : (
          <>
            <p>
              <strong>Max Withdrawal:</strong>{' '}
              {maxWithdrawal.toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}
            </p>
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer>
                <LineChart 
                  data={chartData}
                  margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalAssets"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default JSONCalculatorPage
