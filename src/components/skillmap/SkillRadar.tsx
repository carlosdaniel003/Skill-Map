"use client"

import "./SkillRadar.css"
import {
RadarChart,
PolarGrid,
PolarAngleAxis,
Radar
} from "recharts"

interface Props{

  data:any[]

}

export default function SkillRadar({data}:Props){

  return(

    <RadarChart width={400} height={400} data={data}>

      <PolarGrid/>

      <PolarAngleAxis dataKey="skill"/>

      <Radar
        dataKey="value"
        stroke="#8884d8"
        fill="#8884d8"
        fillOpacity={0.6}
      />

    </RadarChart>

  )

}