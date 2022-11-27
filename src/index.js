import express from 'express';
import users from './database'; 
import { v4 as uuidv4 } from 'uuid';

const app = express()
app.use(express.json())
const port = 3000

const checkUserExists = (request, response, next) => {
    const findUser = users.find(user => user.email === request.body.email)
    console.log(findUser)
    
    if(findUser){
        return response.status(404).json({ error: "User already exists" })
    }

    // request.user = {
    //     userIndex: findUserIndex
    // }

    return next()
}

const createUserService = ({ name, email }) => {

    const newUser = {
        name,
        email,
        id: uuidv4()
    }

    users.push(newUser)

    return [201, newUser]
}

const listUsersService = () => {
    return users
}

const createUserController = (request, response) => {
    const [status, data] = createUserService(request.body)

    return response.status(status).json(data)
}

const listUsersController = (request, response) => {
    const list = listUsersService()
    return response.json(list)
}

app.post('/register', checkUserExists, createUserController)
app.get('/users', listUsersController)

app.get('/', (req, res) => {
    return res.send('Alô, alô, testando!')
})

app.listen(port, () => {
    return console.log(`Rodando em http://localhost:${port}`)
})

export default app