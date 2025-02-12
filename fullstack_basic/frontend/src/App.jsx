import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    axios.get('/api/users')
    .then((response)=>{
      setUsers(response.data)
    })
    .catch((err)=>{
      console.log(err)
    })
  }, [])
  

  return (
    <div className='text-white'>
      <div className='bg-slate-700 m-8 p-3 rounded-lg'>
        <h1 className='text-center text-2xl pb-3'>Full-Stack Basics Project</h1>
        <h3 className='text-center'> Users : <span className='text-red-400'>{users.length}</span> </h3>
      </div>
      <div className='bg-slate-700 m-8 p-3 rounded-lg'>
          {
            users.map((users,index)=>(
              <div key={users.id}>
                <h4 className='pt-2 text-orange-400'> {users.name} </h4>
                <h4 className='pb-4 text-lime-400'> {users.gender} </h4>
              </div>
            ))
          }
      </div>
      
    </div>
  )
}

export default App
