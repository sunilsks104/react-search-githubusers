import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: '' });

  const searchGithubUser = async (user) => {
    toggleError();
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) => {
      console.log(err);
    });
    console.log(response);
    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      // Repo
      // axios(`${rootUrl}/users/${login}/repos?per_page:100`).then((response) => {
      //   setRepos(response.data);
      // });
      // // followers
      // axios(`${followers_url}?per_page:100`).then((response) => {
      //   setfollowers(response.data);
      // });

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page:100`),
        axios(`${followers_url}?per_page:100`),
      ])
        .then((result) => {
          const [repos, followers] = result;
          const status = 'fulfilled';
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        })
        .catch((err) => console.log(err));
    } else {
      toggleError(true, 'there is no user with that username');
    }
    checkRequests();
    setIsLoading(false);
    // try {
    //   const resp = await axios(`${rootUrl}/users/${user}`);
    //   console.log(resp);
    //   if (!resp) {
    //     toggleError(true, 'there is no user with that username');
    //   }
    //   setGithubUser(resp.data);
    // } catch (error) {
    //   console.log(user);
    // }
  };

  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let { remaining } = data.rate;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, ' You have exceeded your hourly limit!');
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  function toggleError(show = false, msg = '') {
    setError({ show, msg });
  }

  useEffect(checkRequests, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
