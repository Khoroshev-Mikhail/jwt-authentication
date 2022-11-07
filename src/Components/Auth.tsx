import { Button, Label, TextInput } from "flowbite-react";

export default function Auth(){
    return(
        <div className="w-full sm:w-96 mx-auto p-4 bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
        <form className="flex flex-col gap-4">
        <div>
            <div className="mb-2 block">
            <Label
                htmlFor="email1"
                value="Your email"
            />
            </div>
            <TextInput
            id="email1"
            type="email"
            placeholder=""
            required={true}
            />
        </div>
        <div>
            <div className="mb-2 block">
            <Label
                htmlFor="password1"
                value="Your password"
            />
            </div>
            <TextInput
            id="password1"
            type="password"
            required={true}
            />
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="remember">
            Remember me
            </Label>
        </div>
        <Button type="submit">
            Submit
        </Button>
        </form>
        </div>
    )
}