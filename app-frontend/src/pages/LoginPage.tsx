import { GoogleLoginButton } from "../components/GoogleLoginButton";
import { _42schoolLoginButton } from "../components/_42schoolLoginButton";
import { useAuth } from "../context/AuthContext";
import {Navigate} from 'react-router-dom';


export function LoginPage(){

const {isAuthenticated} = useAuth();

if (isAuthenticated){
    return <Navigate to='/dashboard' replace/>
}

return (
<div>
    <div>
        <h1>OAUTH COM GOOGLE</h1>
        <GoogleLoginButton/>
    </div>

    <div>
        <h1>OAUTH COM 42</h1>
        <_42schoolLoginButton/>
    </div>
</div>


);

}