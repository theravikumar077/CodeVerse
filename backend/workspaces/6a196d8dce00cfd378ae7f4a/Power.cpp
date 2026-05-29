#include <bits/stdc++.h>
using namespace std;

// Function to calculate x^n
long long power(long long x, long long n) {
    long long result = 1;
    while (n > 0) {
        // Agar n odd hai, multiply result by x
        if (n % 2 == 1) {
            result *= x;
        }
        x *= x;   // x ko square karo
        n /= 2;   // n ko half karo
    }
    return result;
}

int main() {
    long long x = 2;
    long long n = 10;

    cout << x << "^" << n << " = " << power(x, n) << endl;

    return 0;
}
