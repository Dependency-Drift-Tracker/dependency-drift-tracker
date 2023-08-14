import { expect } from 'chai';
import sinon from 'sinon';
import {
  parseRepositoryLine,
  parseFile,
  cloneRepository,
  replaceRepositoryVariablesWithEnvVariables,
  replaceRepositoryWithSafeChar,
  createSummary,
} from '../src/index.mjs';

describe('#parseRepositoryLine', function() {
  it('parse simple repository', function() {
    expect(parseRepositoryLine('https://github.com/1024pix/pix.git')).to.deep.equal({
      repository: 'https://github.com/1024pix/pix.git',
      path: ''
    })
  });

  it('parse repository with a sub directory', function() {
    expect(parseRepositoryLine('https://github.com/1024pix/pix.git#test')).to.deep.equal({
      repository: 'https://github.com/1024pix/pix.git',
      path: 'test'
    })
  });
});

describe('#parseFile', function() {
  it('parse the file', function() {
    const content = `
https://github.com/1024pix/pix.git#api
https://github.com/1024pix/pix.git#mon-pix
# comment line
`;
    expect(parseFile(content)).to.deep.equal([
      {
        repository: 'https://github.com/1024pix/pix.git',
        path: 'api',
      },
      {
        repository: 'https://github.com/1024pix/pix.git',
        path: 'mon-pix'
      },
    ])
  });
});

describe('#cloneRepository', function() {
  it('create a temporary directory and clone the repository there', async function() {
    const simpleGit = {
      clone: sinon.stub().resolves(null)
    };
    const repositoryPath = await cloneRepository('https://github.com/1024pix/pix.git', simpleGit, {});
    expect(simpleGit.clone.calledWith('https://github.com/1024pix/pix.git')).to.be.true;
    expect(repositoryPath).to.be.a('string');
  });

  it('create a temporary directory and clone the repository there with variable substition', async function() {
    const simpleGit = {
      clone: sinon.stub().resolves(null)
    };
    const repositoryPath = await cloneRepository('https://$FOO@github.com/1024pix/pix.git', simpleGit, { FOO: 'BAR' });
    expect(simpleGit.clone.calledWith('https://BAR@github.com/1024pix/pix.git')).to.be.true;
    expect(repositoryPath).to.be.a('string');
  });
});

describe('#replaceRepositoryVariablesWithEnvVariables', function() {
  [
    {
      repository: 'https://$FOO@github.com/1024pix/pix.git',
      variables: { },
      expected: 'https://$FOO@github.com/1024pix/pix.git',
    },
    {
      repository: 'https://$FOO@github.com/1024pix/pix.git',
      variables: { FOO: 'BAR'  },
      expected: 'https://BAR@github.com/1024pix/pix.git',
    },
    {
      repository: 'https://$FOO:$FOO@github.com/1024pix/pix.git',
      variables: { FOO: 'BAR'  },
      expected: 'https://BAR:BAR@github.com/1024pix/pix.git',
    },
    {
      repository: 'https://$FOO:$BAR@github.com/1024pix/pix.git',
      variables: { FOO: 'BAR', BAR: 'FOO'  },
      expected: 'https://BAR:FOO@github.com/1024pix/pix.git',
    },
  ].forEach(({ repository, variables, expected }) => {
    it(`replace var in the ${repository} string by env var`, function() {
      const result = replaceRepositoryVariablesWithEnvVariables(repository, variables);
      expect(result).to.equal(expected);
    });
  });
});

describe('#replaceRepositoryWithSafeChar', function() {
  [
    {
      given: 'https://github.com/1024pix/pix.git',
      expect: 'github-com-1024pix-pix-git'
    },
    {
      given: 'https://github.com/1024pix/pix.git#api',
      expect: 'github-com-1024pix-pix-git-api'
    },
    {
      given: 'http://github.com/1024pix/pix.git#api',
      expect: 'github-com-1024pix-pix-git-api'
    },
  ].forEach((line) => {
    it(`replace the repository line '${line.given}' with safe chars`, function () {
      expect(replaceRepositoryWithSafeChar(line.given)).to.equal(line.expect);
    });
  });
});

describe('#createSummary', function() {
  it('create a summary of the result', function() {
    const result = [
      {
        drift: 1,
        pulse: 2,
      },
      {
        drift: 3,
        pulse: 1,
      },
      {},
    ];
    const summary = createSummary(result)
    expect(summary).to.deep.include({
      drift: 4,
      pulse: 3,
    });
    expect(summary.date).to.exist;
  });
});
