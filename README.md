# Dependency drift tracker

Track your NPM dependencies drift across multiple git repositories using [libyear][]. It store the result on flat files and display the drift over time via a webpage.

## Usage

### Using the GitHub Action

The [dependency-drift-tracker GitHub action][action] is the easiest way to use track your dependencies drift over time. It runs every day and update the data files.
To get started, head over to the [dependency-drift-status][template] repository and click on *Use this template* button on the top right corner. Then enter a repository name and click on *Create repository*.

The next step is to enable GitHub Pages for your repository:

1. Go to your repository *Settings* page
1. Go to the *Pages* sub-section on the left
1. Under *Source*, select *Deploy from a branch*
1. In the Branch dropdown, select **main** and **/docs**
1. Click on *Save*

And then you edit the `repositories.txt` file to add the git repositories you want to to track, one per line. See the configuration section for more details on it.

Once finished, you an trigger an initial run of the action:

1. Go to your repository *Actions* page
1. Click on *Update libyear info* on the left
1. In the message banner *This workflow has a workflow_dispatch event trigger.*, click on *Run workflow* and in the dropdown click on "Run workflow" with the branch main.
1. After a few minutes, your data files should be up to date

### Standalone

The standalone version is not tied to GitHub action and do not require a git repository to store the data files.

Create an empty directory with a `data` directory.

```shell
mkdir --parents repository-drift/data
cd repository-drift
```

And create a `repositories.txt` file with one git repository per line. See the configuration option to learn more on it.

Then run:

```shell
npx dependency-drift-tracker
```

It will create or update json files in the data directory. You can then initialize a git repositories to keep track of the changes.

### Configuration

The `*repositories.txt` file contains the git repositories you want to track. Put one repository per line with the full URL to access it.

    https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker
    https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker-action

If your package.json is in a subdirectory, you can use the `#` to specify the path:

    https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker-action#path/to/dir

## Development

Run tests

```shell
npm test
```

## License

GNU GPL 3

[libyear]: https://libyear.com/
[action]: https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker-action
[template]: https://github.com/Dependency-Drift-Tracker/dependency-drift-status
