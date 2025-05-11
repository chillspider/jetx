clean:
	@-rm -rf test/*

build:
	@-cat ci/* > values-ci.yaml
	@-helm template test . -f values-ci.yaml --output-dir test;

	@-echo '------------------List of charts------------------'
	@-ls test/*/* | awk '{print $0}'
	@-echo ''
	@-rm values-ci.yaml
