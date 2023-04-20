/*
Handles Javascript utility for the account createion page
*/
document.addEventListener("DOMContentLoaded",()=>{
    /*
    Add an event listtener to the create account from the login page
    */
    const loginForm = document.querySelector("#loginDiv");
    const createForm = document.querySelector("#createDiv");

    const createUserUsername = document.querySelector("#usernameCreate");
    const createUserPassword = document.querySelector("#passwordCreate");
    
    const loginUsername = document.querySelector("#usernameLogin");
    const loginPassword = document.querySelector("#passwordLogin");

    document.getElementById("goToLogin").addEventListener("click", (e) =>{
      document.querySelector("#loginMessage").classList.add("hidden");
        e.preventDefault();
        createUserUsername.value = "";
        createUserPassword.value = "";
        loginUsername.value = "";
        loginPassword.value = "";

        loginForm.classList.remove("hidden");
        createForm.classList.add("hidden");
    });
    document.getElementById("goToCreate").addEventListener("click", (e) =>{        
      document.querySelector("#createMessage").classList.add("hidden");
        e.preventDefault();
        createUserUsername.value = "";
        createUserPassword.value = "";
        loginUsername.value = "";
        loginPassword.value = "";

        createForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    });
    
    /**
     * Handles the creation of a user
     */
    document.getElementById("createButton").addEventListener("click",async (e) =>{
        // checks to see if anyfields are blank
        if(createUserPassword.value == "" || createUserUsername.value==""){
            createUserPassword.value == "";
            createUserPassword.value == "";
            // update the message field
            document.querySelector("#createMessage").classList.remove("hidden");
            document.querySelector("#createMessage").textContent = "Please fill out all the Fields"
        }
        document.querySelector("#createMessage").classList.add("hidden");
        // sends the username and password to the backend
        const user = await createAccount(createUserUsername.value,createUserPassword.value)
        .then(user => 
          {
            if(user.duplicate){
              document.querySelector("#createMessage").classList.remove("hidden");
              document.querySelector("#createMessage").textContent = "Username already Taken";
            }
            else{// if sucess go to login page
          createForm.classList.add("hidden");
          loginForm.classList.remove("hidden");}
        })
        .catch(error =>{
          console.log(error);
          document.querySelector("#createMessage").classList.remove("hidden");
          document.querySelector("#createMessage").textContent = "Error making User";
        });

    });
    /*handles logins
    */
   document.getElementById("loginButton").addEventListener("click", async (e) =>{
    //checks to see if any fields are blank
    if(loginUsername.value == "" || loginPassword.value=="blank"){
        loginUsername.value == "";
        loginPassword.value == "";
        // update the message field
        document.querySelector("#loginMessage").classList.remove("hidden");
        document.querySelector("#loginMessage").value = "Please fill out all the Fields";
    }else{
      const login = await attemptLogin(document.getElementById("usernameLogin").value, document.getElementById("passwordLogin").value)
      .then(login =>{
        if(login.success){
          window.location.href = '../home.html'
        }
        else{
          // Display error message if login fails
          document.querySelector("#loginMessage").classList.remove("hidden");
          document.querySelector("#loginMessage").textContent =   ("Error Loggin In")
        }
      })
    }    
   });    
});
async function  createAccount(username, password) {
    const url = '/auth/register';
  
    const requestBody = {
      username: username,
      password: password
    };
  
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    };
    const response = await fetch(url,requestOptions);
    return response.json();
  }
async function attemptLogin(username, password){
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: username, password: password })
  })
  return response.json();
 
}
