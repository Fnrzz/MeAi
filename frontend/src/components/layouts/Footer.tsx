export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo.png" alt="MeAi" className="h-5 w-auto" />
              <span className="text-sm font-bold text-gray-900">MeAi</span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs">
              Payment & identity infrastructure for autonomous AI agents on Sui.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div>
              <p className="font-semibold text-gray-900 mb-2 uppercase tracking-wider">Product</p>
              <div className="space-y-1.5 text-gray-400">
                <a href="/dashboard" className="block hover:text-blue-600 transition-colors">Dashboard</a>
                <a href="/playground" className="block hover:text-blue-600 transition-colors">Playground</a>
                <a href="/api-keys" className="block hover:text-blue-600 transition-colors">API Keys</a>
                <a href="/admin" className="block hover:text-blue-600 transition-colors">Admin</a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2 uppercase tracking-wider">Developers</p>
              <div className="space-y-1.5 text-gray-400">
                <a href="/docs" className="block hover:text-blue-600 transition-colors">Documentation</a>
                <a href="/docs" className="block hover:text-blue-600 transition-colors">Python SDK</a>
                <a href="/docs" className="block hover:text-blue-600 transition-colors">JavaScript SDK</a>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-2 uppercase tracking-wider">Hackathons</p>
              <div className="space-y-1.5 text-gray-400">
                <span>Sui Overflow 2026</span>
                <span>Agentic Web Track</span>
                <span>Tatum x Walrus</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            Built on Sui · Capability Objects · PTB · Walrus
          </p>
          <p className="text-xs text-gray-400">
            &copy; 2026 MeAi
          </p>
        </div>
      </div>
    </footer>
  );
}
