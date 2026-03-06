import "./SkillLevelGrid.css"

interface Props{

  skills: Record<string, number>

}

export default function SkillLevelGrid({skills}:Props){

  return(

    <div className="skillGrid">

      {Object.entries(skills).map(([skill,value])=>(

        <div key={skill} className="skillItem">

          <span>{skill}</span>
          <strong>{value}</strong>

        </div>

      ))}

    </div>

  )

}