# Contribution Guidelines

Thanks for going the extra mile to make the dev experience better! Below are some basic guidelines to follow to get your PR merged :)

## Creating a Pull Request

1. [Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) the repository.
2. On your copy of the repo, create a new branch. Be sure that your branch contains the most recent changes from the main branch.
3. Make any necessary changes, then commit and push them to your fork.
4. Go to the main docs repo in your browser and open a new pull request.
5. Title the pull request to describe your contribution, and include a short summary of the changes. If an open issue is associated with your changes, tag the issue by referencing the issue number ( i.e., #123) in the pull request summary.
6. If there is a relevant label like "typo", "bug", or "enhancement", include the label in the PR.

## A standard flow to set up a fork

Set up your fork with the following terminal commands, or an alteration of them to suit your environment:

```
cd interface
git remote add upstream https://github.com/uniswapfoundation/interface.git
git fetch upstream
git pull --rebase upstream main
git checkout -b "my-contribution"
```

## Contribution Requests

Since this is a test interface, we want to add as many features as possible to simplify the development experience for v4. Please feel free to open an issue or submit a PR for any feature you think would be useful. 