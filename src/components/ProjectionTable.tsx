import React, { FC } from 'react'
import { ProjectionLogic } from '../projection-logic'
import { Projection } from '../data-types'

interface Props {
  projection: Projection
}

const ProjectionTable: FC<Props> = ({ projection }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Investments</th>
          <th>RRSP</th>
          <th>TFSA</th>
          <th>Total</th>
          <th>Salary</th>
          <th>Inv Income</th>
          <th>RRSP W/d</th>
          <th>Credits</th>
          <th>Debits</th>
          <th>Tax Paid</th>
          <th>Total Exp.</th>
          <th>OAS</th>
          <th>Clawback</th>
        </tr>
      </thead>
      <tbody>
        {projection.map((yearData) => {
          const totalAssets = yearData.amountInvested + yearData.amountInRRSP + yearData.amountInTFSA
          const oneOffTotal = yearData.oneOffExpenses.reduce((a,b) => a + b.amount, 0)
          const totalExpenses = yearData.expenses + yearData.healthcareExpenses + oneOffTotal

          return (
            <tr key={yearData.year}>
              <td className="year-col">
                {yearData.calendarYear}
                <br/>Year {yearData.year}
                <br/>Age {yearData.age}
                {yearData.homeSaleProceeds > 0 && (
                  <div>(+{ProjectionLogic.formatMoney(yearData.homeSaleProceeds)} home sale)</div>
                )}
              </td>
              <td>{ProjectionLogic.formatMoney(yearData.amountInvested)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.amountInRRSP)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.amountInTFSA)}</td>
              <td>{ProjectionLogic.formatMoney(totalAssets)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.salary)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.investmentIncome)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.rrspWithdrawal)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.credits)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.debits)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.taxPaid)}</td>
              <td>
                {ProjectionLogic.formatMoney(totalExpenses)}
                {oneOffTotal > 0 && (
                  <div>(+{ProjectionLogic.formatMoney(oneOffTotal)} one-off)</div>
                )}
              </td>
              <td>{ProjectionLogic.formatMoney(yearData.oasAfterClawback)}</td>
              <td>{ProjectionLogic.formatMoney(yearData.oasClawback)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default ProjectionTable
