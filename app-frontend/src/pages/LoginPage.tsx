import { LoginButton } from "../components/LoginButton";
import { useAuth } from "../context/AuthContext";
import {Navigate} from 'react-router-dom';


export function LoginPage(){

const {isAuthenticated} = useAuth();

if (isAuthenticated){
    return <Navigate to='/dashboard' replace/>
}

return (
<div>
    <h1></h1>
    <LoginButton/>
</div>
);

}