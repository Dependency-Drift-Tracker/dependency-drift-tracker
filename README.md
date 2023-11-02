# Dependency drift tracker

Track your NPM dependencies drift across multiple repositories using [libyear][]. It store the result on flat files. A webpage can be used to display the drift over time.

## Usage

On GitHub, the [github action][action] is the easiest way to use dependency drift tracker.

Create an empty directory with a `data` directory.

```shell
mkdir -p repository-drift/data
cd repository-drift
touch repositories.txt
```

And create a `repositories.txt` file with one git repository per line.

    https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker
    https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker-action

If your package.json is in a subdirectory, you can use the `#` to specify the path:

    https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker-action#path/to/dir

Then run:

```shell
npx --package=https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker -- dependency-drift-tracker
```

It will create or update json files in the data directory.

## Development

Run tests

```shell
npm test
```

## License

GNU GPL 3

[libyear]: https://libyear.com/
[action]: https://github.com/Dependency-Drift-Tracker/dependency-drift-tracker-action
