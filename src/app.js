import express, { request, response } from 'express';
import users from './database'; 
import { v4 as uuidv4 } from 'uuid';
import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken'

const app = express()
app.use(express.json())
const port = 3000

// MIDDLEWARES
const checkEmailExists = (request, response, next) => {
    const findUser = users.find(user => user.email === request.body.email)
    
    if(findUser){
        return response.status(409).json({ message: "E-mail already registered" })
    }

    return next()
}

const checkAuthExists = (request, response, next) => {
    let auth = request.headers.authorization

    if(!auth){
        return response.status(401).json({ message: "Missing authorization headers" })
    }

    auth = auth.split(' ')[1]

    return jwt.verify(auth, "SECRET_KEY", (error, decoded) => {
        if(error){
            return response.status(401).json({ message: "Invalid Token" })
        }

        request.user = {
            id: decoded.sub
        }

        return next()
    })
}

const checkUserIsAdm = (request, response, next) => {
    const user = users.find(elem => elem.uuid === request.user.id)
    
    if(!user.isAdm){
        return response.status(403).json({ message: "Missing Admin Permissions" })
    }

    return next()
}

const checkNotAdminButHaveId = (request, response, next) => {
    const user = users.find(elem => elem.uuid === request.user.id)
    console.log(user)
    
    if(!user.isAdm && user.uuid !== request.user.id){
        return response.status(403).json({ message: "Missing Admin Permissions" })
    }

    return next()
}

// SERVICES
const createUserService = async ({ name, email, password, isAdm }) => {
    const newUser = {
        name,
        email,
        password: await hash(password, 10),
        isAdm,
        createdOn: new Date(),
        updatedOn: new Date(),
        uuid: uuidv4()
    }

    users.push(newUser)
    
    const userResponse = {
        name: newUser.name,
        email: newUser.email,
        isAdm: newUser.isAdm,
        createdOn: newUser.createdOn,
        updatedOn: newUser.updatedOn,
        uuid: newUser.uuid
    }

    return [201, userResponse]
}

const userLoginService = async ({ email, password }) => {
    const loggedUser = users.find(user => user.email === email)
    
    if(!loggedUser){
        return [401, {message: "Wrong email/password"}]
    }
    
    const comparePassword = await compare(password, loggedUser.password);

    if(!comparePassword){
        return [401, { message: "Wrong email/password" }]
    }

    const token = jwt.sign(
        { email },
        "SECRET_KEY",
        { expiresIn: '24h', subject: loggedUser.uuid }
    )

    return [200, { token }]
}

const listUsersService = () => {
    return users
}

const userInfoService = (id) => {
    let user = users.find(elem => elem.uuid === id)
    delete user.password
    
    if(user === null || user === undefined){
        return [404, { message: "User not found"}]
    }

    return [200, user]
}

const editInfoService = () => {
    const { id } = request.params
    const user = users.find(elem => elem.uuid === id)
    console.log(user)
}

const deleteUserService = (id) => {
    const userIndex = users.findIndex(elem => elem.uuid === id)

    if(userIndex === -1){
        return [403, { message: "Missing Admin Permissions"}]
    }

    users.splice(userIndex, 1)
    
    return [204, { message: "User deleted with success" }]
}

// CONTROLLERS
const createUserController = async (request, response) => {
    const [status, data] = await createUserService(request.body)

    return response.status(status).json(data)
}

const userLoginController = async (request, response) => {
    const [status, token] = await userLoginService(request.body)

    return response.status(status).send(token)
}

const listUsersController = (request, response) => {
    const list = listUsersService()
    return response.json(list)
}

const userInfoController = (request, response) => {
    const [status, data] = userInfoService(request.user.id)
    return response.status(status).json(data)
}

const editInfoController = (request, response) => {
    const [status, data] = editInfoService(request.user.id)
    return response.status(status).json(data)
}

const deleteUserController = (request, response) => {
    const [status, data] = deleteUserService(request.user.id)
    return response.status(status).json(data)
}

// ROUTERS
app.post('/users', checkEmailExists, createUserController)
app.post('/login', userLoginController)
app.get('/users', checkAuthExists, checkUserIsAdm, listUsersController)
app.get('/users/profile', checkAuthExists, userInfoController)
app.patch('/users/:uuid', checkAuthExists, checkNotAdminButHaveId, editInfoController) 
app.delete('/users/:uuid', checkAuthExists, checkNotAdminButHaveId, deleteUserController)

app.get('/', (req, res) => {
    return res.send('Alô, alô, testando!')
})

app.listen(port, () => {
    return console.log(`Rodando em http://localhost:${port}`)
})

export default app