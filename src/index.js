import express from 'express';
import users from './database'; 
import { v4 as uuidv4 } from 'uuid';

const app = express()
app.use(express.json())
const port = 3000

const createUserService = ({ name, email }) => {
    const findUser = users.find(user => user.email === email)

    if(findUser){
        return [401, { error: "User already exists" }]
    }

    const newUser = {
        name,
        email,
        id: uuidv4()
    }

    users.push(newUser)

    return [201, newUser]
}

const createUserController = (request, response) => {
    const [status, data] = createUserService(request.body)

    return response.status(status).json(data)
}

app.post('/register', createUserController)

app.get('/', (req, res) => {
    return res.send('Alô, alô, testando!')
})

app.listen(port, () => {
    return console.log(`Rodando em http://localhost:${port}`)
})

export default app