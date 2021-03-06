const sass = require('sass')
const fs = require('fs')
const useref = require('useref')
const loadGruntTasks = require('load-grunt-tasks')
const browserSync = require('browser-sync')
const bs = browserSync.create()

const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/w_zce'
        },
        {
          name: 'About',
          link: 'https://weibo.com/zceme'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/zce'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}
module.exports = grunt => {
  grunt.initConfig({
    clean: ['temp/**', 'dist/**'],

    sass: {
      options: {
        sourceMap: true,
        implementation: sass, // implementation指定在grunt-sass中使用哪个模块对sass进行编译，我们使用npm中的sass
      },
      main: {
        files: {
          'temp/assets/styles/main.css': 'src/assets/styles/main.scss'
        }
      }
    },

    babel: {
      options: {
        presets: ['@babel/preset-env'],
        sourceMap: true
      },
      main: {
        files: {
          'temp/assets/scripts/main.js': 'src/assets/scripts/main.js'
        }
      }
    },
    web_swig: {
      options: {
        swigOptions: {
          cache: false
        },
        getData: function (tpl) {
          return data;
        }
      },
      main: {
        expand: true,
        cwd: 'src/',
        src: "**/*.html",
        dest: "temp/"
      },
    },

    uglify: {
      main: {
        files: [{
          expand: true,
          cwd: 'temp/',
          src: ['assets/scripts/*.js', '!*.min.js'],
          dest: 'dist/',
          ext: '.min.js'
        }]
      }
    },
    cssmin: {
      main: {
        files: [{
          expand: true,
          cwd: 'temp/',
          src: ['assets/styles/*.css', '!*.min.css'],
          dest: 'dist/',
          ext: '.min.css'
        }]
      }
    },
    htmlmin: {
      main: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: [{
          expand: true,
          cwd: 'temp/',
          src: ['**/*.html'],
          dest: 'dist/'
        }]
      },
    },
    eslint: {
      options: {
        rulePaths: ['src/assets/scripts/']
      },
      target: ['src/assets/scripts/main.js']
    },
    sasslint: {
      main: {
        options: {
          configFile: 'config/.sass-lint.yml',
          rulePaths: ['src/assets/scripts/']
        },
        target: ['src/assets/styles/main.scss']
      }
    },
    image: {
      main: {
        options: {
          optipng: false,
          pngquant: true,
          zopflipng: true,
          jpegRecompress: false,
          mozjpeg: true,
          gifsicle: true,
          svgo: true
        },
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['assets/fonts/*', 'assets/images/*'],
          dest: 'dist/'
        }]
      },
    },
    copy: {
      main: {
        files: [{
          expand: true,
          cwd: 'public/',
          src: ['**'],
          dest: 'dist/'
        }]
      },
    },
    watch: {
      js: {
        files: ['src/js/*.js'],
        tasks: ['babel', 'bs-reload']
      },
      css: {
        files: ['src/scss/*.scss'],
        tasks: ['sass', 'bs-reload']
      },
      html: {
        files: ['src/**/*.html'],
        tasks: ['web_swig', 'bs-reload']
      }
    },
    
    ghDeploy: {
      options: {
        repository: 'https://github.com/2604150210/pages-boilerplate-grunt.git',
        deployPath: 'dist',
       	branch: grunt.option('branch') || 'gh-pages',
    	  message: 'Auto deplyment ' + grunt.template.today()
    },
    	// repository: 'https://github.com/2604150210/pages-boilerplate-grunt.git',
    	// branch: grunt.option('branch') || 'gh-pages',
    	// deployPath: 'dist',
    	// message: 'Auto deplyment ' + grunt.template.today()
    }
  })

  grunt.registerTask("jal-useref", function () {
    const done = this.async()
    const cwd = 'temp/'
    const htmls = ['index.html', 'about.html']
    htmls.forEach((html, index) => {
      const inputHtml = fs.readFileSync(cwd + html, "utf8")
      const [code, result] = useref(inputHtml)
      for (let type in result) {
        const dests = Object.keys(result[type])
        dests.forEach(dest => {
          const src = result[type][dest].assets
          let read
          const files = src.map(file => {
            read = cwd + file
            if(file[0] === '/') {
              read = file.substr(1)
            }
            return fs.readFileSync(read)
          })
          fs.writeFile(cwd + dest, files.join(''), (err) => {
            if (err) {
                return console.error(err);
            }
            console.log(`${cwd + dest}数据写入${read}成功！`);
          })
        })
      }
      fs.writeFile(cwd + html, code, (err) => {
        if (err) {
          return console.error(err);
        }
        console.log(`${cwd + html}重写成功！`);
        if(index === htmls.length - 1) {
          done()
        }
      })
    })
  });

  // grunt.loadNpmTasks('grunt-sass')

  loadGruntTasks(grunt) // 自动加载所有的grunt插件中的任务
  grunt.registerTask("bs-init", function () {
    const done = this.async();
    bs.init({
      notify: false,
      port: grunt.option('port') || 2080,
      open: grunt.option('open'),
      // files: 'temp/**',
      server: {
        baseDir: ['temp', 'src', 'public'], // 按顺序查找
        routes: {
          '/node_modules': 'node_modules'
        }
      }
    }, function (err, bs) {
      done();
    });
  });
  grunt.registerTask("bs-reload", function () {
    bs.reload()
  });

  grunt.registerTask('lint', ['sasslint', 'eslint'])

  grunt.registerTask('compile', ['sass', 'babel', 'web_swig'])

  grunt.registerTask('serve', ['compile', 'bs-init', 'watch'])

  grunt.registerTask('start', ['compile', 'watch'])

  grunt.registerTask('build', ['clean', 'compile', 'jal-useref', 'image', 'uglify', 'cssmin', 'htmlmin', 'copy'])

  grunt.registerTask('deploy', ['ghDeploy'])

}