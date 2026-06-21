import { useState } from 'react'
import { useTripStore } from '../store/tripStore'
import { AVATAR_CLASSES } from '../constants'

export default function PersonList() {
  const current = useTripStore(s => s.current)
  const addPerson = useTripStore(s => s.addPerson)
  const removePerson = useTripStore(s => s.removePerson)
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const name = input.trim()
    if (!name || current.people.includes(name)) return
    addPerson(name)
    setInput('')
  }

  return (
    <section className="people-section">
      <div className="people-list">
        {current.people.map((p, i) => (
          <div key={p} className="person-chip">
            <span className={`avatar ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`}>
              {p.trim().slice(0, 2).toUpperCase()}
            </span>
            <span>{p}</span>
            <button onClick={() => removePerson(p)} aria-label={`Remove ${p}`}>✕</button>
          </div>
        ))}
      </div>
      <div className="add-person-row">
        <input
          type="text"
          placeholder="Add person…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button className="btn btn-soft" onClick={handleAdd}>Add</button>
      </div>
    </section>
  )
}
