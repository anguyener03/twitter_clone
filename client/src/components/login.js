/*
Handles Javascript utility for the account createion page
*/
document.addEventListener("DOMContentLoaded",()=>{
    /*
    Add an event listtener to the create account from the login page
    */
    const loginForm = document.querySelector("#loginDiv");
    const createForm = document.querySelector("#createDiv");
    document.getElementById("goToLogin").addEventListener("click", (e) =>{
        e.preventDefault();
        loginForm.classList.remove("hidden");
        createForm.classList.add("hidden");
    });
    document.getElementById("goToCreate").addEventListener("click", (e) =>{
        e.preventDefault();
        createForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    });
    const createUserUsername = document.querySelector("#usernameCreate");
    const createUserPassword = document.querySelector("#passwordCreate")
    /**
     * Handles the creation of a user
     */
    document.getElementById("createButton").addEventListener("click",async (e) =>{
        // checks to see if anyfields are blank
        if(createUserPassword.value == "" || createUserUsername.value=="blank"){
            createUserPassword.value == "";
            createUserPassword.value == "";
            // update the message field
            document.querySelector("#createMessage").classList.remove("hidden");
            document.querySelector("#createMessage").textContent = "Please fill out all the Fields"
        }
        document.querySelector("#createMessage").classList.add("hidden");
        // sends the username and password to the backend
        const user = await createAccount(createUserUsername.value,createUserPassword.value).catch(error =>{
          document.querySelector("#createMessage").classList.remove("hidden");
          document.querySelector("#createMessage").textContent = "Username already Taken"
        });
        // if sucess go to login page
        createForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
    });
    /*handles logins
    */
   const loginUsername = document.querySelector("#usernameLogin");
   const loginPassword = document.querySelector("#passwordLogin");
   document.getElementById("loginButton").addEventListener("click",(e) =>{
    //checks to see if any fields are blank
    if(loginUsername.value == "" || loginPassword.value=="blank"){
        loginUsername.value == "";
        loginPassword.value == "";
        // update the message field
        document.querySelector("#loginMessage").classList.remove("hidden");
        document.querySelector("#loginMessage").textContent = "Please fill out all the Fields"
    }

   });
    
});
async function  createAccount(username, password) {
    const url = '/register';
  
    const requestBody = {
      username: username,
      password: password
    };
  
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    };
  
    return fetch(url, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error creating account');
        }
        return response.json();
      });
  }
