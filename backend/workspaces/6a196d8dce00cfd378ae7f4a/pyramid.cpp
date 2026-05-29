#include<bits/stdc++.h>
using namespace std;

int main()
{
    for (int i = 0; i < 4; i++) // rows
    {
        for (int k = 0; k < 4 - i - 1; k++)// spaces
        {
            cout << " ";
        }
        
        for (int j = 0; j < 2 * i + 1; j++)// pyramid
        {
            cout << "*";
        }
        cout << endl;
    }
    
    return 0;
}