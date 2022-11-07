import { Button, Label, TextInput } from "flowbite-react";
import { useState } from "react";

export default function Auth(){
    const [login, setLogin] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    async function formHandler(e: any){
        e.preventDefault()
        console.log(JSON.stringify({password, login}))
        const response = await fetch('http://localhost:4000/auth', {
            method: 'POST',            
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            }, 
            body: JSON.stringify({password, login})
        })
        const data = await response.json()
        return data
    }
    return(
        <div className="w-full sm:w-96 mx-auto p-4 bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <form className="flex flex-col gap-4">
                <div>
                    <div className="mb-2 block">
                        <Label htmlFor="login" value="Login"/>
                    </div>
                    <TextInput id="login" type="text" required={true} value={login} onChange={(e)=>setLogin(e.target.value)}/>
                </div>
                <div>
                    <div className="mb-2 block">
                        <Label htmlFor="password" value="Your password" />
                    </div>
                    <TextInput id="password" type="password" required={true} value={password} onChange={(e)=>setPassword(e.target.value)}/>
                </div>
                <Button type="submit" onClick={formHandler}>Submit</Button>
            </form>
        </div>
    )
}